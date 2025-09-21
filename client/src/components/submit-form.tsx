import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSearchResultSchema, type InsertSearchResult } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SubmitForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertSearchResult>({
    resolver: zodResolver(insertSearchResultSchema),
    defaultValues: {
      query: "",
      publicLink: "",
      platform: "ChatGPT",
      description: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: InsertSearchResult) => {
      const response = await apiRequest("POST", "/api/search-results", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Search result submitted successfully!",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/search-results"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit search result. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertSearchResult) => {
    submitMutation.mutate(data);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Submit Search Result</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Search Query</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="What did you search for?"
                    {...field}
                    data-testid="input-submit-query"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="publicLink"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Public Share Link</FormLabel>
                <FormControl>
                  <Input 
                    type="url"
                    placeholder="https://chatgpt.com/share/..."
                    {...field}
                    data-testid="input-submit-link"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="platform"
            render={({ field }) => (
              <FormItem>
                <FormLabel>AI Platform</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-submit-platform">
                      <SelectValue placeholder="Select platform..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ChatGPT">ChatGPT</SelectItem>
                    <SelectItem value="Claude">Claude</SelectItem>
                    <SelectItem value="Gemini">Gemini</SelectItem>
                    <SelectItem value="DeepSeek">DeepSeek</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    rows={3}
                    placeholder="Brief description of the conversation..."
                    className="resize-none"
                    {...field}
                    data-testid="textarea-submit-description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full"
            disabled={submitMutation.isPending}
            data-testid="button-submit-result"
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Result"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
